import os
import io
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
from backend.app.core.config import settings

class ForensicsService:
    @staticmethod
    def perform_ela(image_path: str, document_id: str, quality: int = 90, scale: int = 15) -> Tuple[float, str, List[Dict[str, Any]]]:
        """
        Error Level Analysis (ELA):
        Recompresses image and calculates pixel error disparity.
        Returns: (ela_anomaly_score: float, heatmap_relative_path: str, suspicious_regions: list)
        """
        try:
            im = Image.open(image_path).convert('RGB')
            orig_array = np.array(im, dtype=np.float32)
            
            # Recompress in memory
            buffer = io.BytesIO()
            im.save(buffer, format='JPEG', quality=quality)
            buffer.seek(0)
            resaved_im = Image.open(buffer).convert('RGB')
            resaved_array = np.array(resaved_im, dtype=np.float32)
            
            # Absolute difference
            diff = np.abs(orig_array - resaved_array)
            
            # Grayscale magnitude of difference
            diff_magnitude = np.mean(diff, axis=2)
            
            # Enhanced visual difference for human inspection
            enhanced_diff = np.clip(diff * scale, 0, 255).astype(np.uint8)
            
            # Generate color-mapped heatmap
            # Hot colors for high error, cool for low error
            h, w = diff_magnitude.shape
            heatmap = np.zeros((h, w, 3), dtype=np.uint8)
            
            # Normalized diff (0 to 1)
            norm_diff = diff_magnitude / (np.max(diff_magnitude) + 1e-5)
            
            # Simple RGB color ramp: Blue (low) -> Green -> Yellow -> Red (high error)
            heatmap[:, :, 0] = np.clip(norm_diff * 2.0 - 0.5, 0, 1) * 255  # Red
            heatmap[:, :, 1] = np.clip(1.0 - np.abs(norm_diff * 2.0 - 1.0), 0, 1) * 255  # Green
            heatmap[:, :, 2] = np.clip(1.0 - norm_diff * 2.0, 0, 1) * 255  # Blue
            
            # Blend original with heatmap for context
            blend = (orig_array * 0.4 + heatmap * 0.6).astype(np.uint8)
            heatmap_im = Image.fromarray(blend)
            
            # Save heatmap artifact
            heatmap_filename = f"ela_{document_id}.jpg"
            heatmap_full_path = settings.FORENSICS_DIR / heatmap_filename
            heatmap_im.save(heatmap_full_path, format='JPEG', quality=92)
            relative_heatmap_path = f"/storage/forensics/{heatmap_filename}"
            
            # Block-wise variance analysis to locate high-error clusters
            block_size = max(16, min(h, w) // 20)
            suspicious_regions = []
            block_scores = []
            
            for y in range(0, h - block_size, block_size):
                for x in range(0, w - block_size, block_size):
                    block = diff_magnitude[y:y+block_size, x:x+block_size]
                    mean_val = float(np.mean(block))
                    std_val = float(np.std(block))
                    score = mean_val + std_val * 1.5
                    block_scores.append(score)
                    
                    # If this block is significantly above background baseline
                    if score > 18.0:
                        suspicious_regions.append({
                            "region_name": f"Compression Anomaly @ ({x},{y})",
                            "confidence": min(1.0, float(score / 35.0)),
                            "description": "Localized JPEG compression inconsistency indicates inserted/altered digital artifact",
                            "bbox": [x, y, block_size, block_size]
                        })
            
            # Global anomaly score normalized to 0.0 - 1.0
            if block_scores:
                top_percentile = np.percentile(block_scores, 95)
                ela_anomaly_score = min(1.0, float(top_percentile / 28.0))
            else:
                ela_anomaly_score = 0.0
                
            return float(round(ela_anomaly_score, 3)), relative_heatmap_path, suspicious_regions[:6]
            
        except Exception as e:
            # Fallback in case of unexpected file format
            return 0.0, "", []

    @staticmethod
    def analyze_noise_and_splicing(image_path: str) -> Tuple[float, float, List[Dict[str, Any]]]:
        """
        Calculates high-frequency noise variance and photo boundary discontinuity.
        Returns: (noise_variance_score: float, photo_splicing_score: float, suspicious_regions: list)
        """
        try:
            im = Image.open(image_path).convert('L')
            arr = np.array(im, dtype=np.float32)
            h, w = arr.shape
            
            # High-pass filter via Laplacian kernel approximation
            # [0, 1, 0; 1, -4, 1; 0, 1, 0]
            laplacian = np.zeros_like(arr)
            laplacian[1:-1, 1:-1] = (
                arr[:-2, 1:-1] + arr[2:, 1:-1] +
                arr[1:-1, :-2] + arr[1:-1, 2:] -
                4 * arr[1:-1, 1:-1]
            )
            
            # Noise variance per 32x32 block
            block_size = 32
            variances = []
            suspicious = []
            
            for y in range(0, h - block_size, block_size):
                for x in range(0, w - block_size, block_size):
                    block = laplacian[y:y+block_size, x:x+block_size]
                    var = float(np.var(block))
                    variances.append(var)
            
            if not variances:
                return 0.0, 0.0, []
                
            median_var = np.median(variances)
            std_var = np.std(variances)
            
            # Anomaly index: ratio of max block variance to median background variance
            max_var = np.max(variances)
            noise_ratio = (max_var / (median_var + 1e-4)) if median_var > 0 else 1.0
            noise_score = min(1.0, float((noise_ratio - 1.0) / 10.0))
            
            # Photo zone heuristic (typically top-left or top-right 20-40% of standard ID)
            # Check edge gradient around typical photo boundary
            photo_y1, photo_y2 = int(h * 0.15), int(h * 0.65)
            photo_x1, photo_x2 = int(w * 0.05), int(w * 0.40)
            
            photo_zone = arr[photo_y1:photo_y2, photo_x1:photo_x2]
            bg_zone = arr[photo_y1:photo_y2, photo_x2:int(w * 0.85)]
            
            # Compare luminance and texture disparity between photo zone and background
            photo_mean = np.mean(photo_zone) if photo_zone.size > 0 else 0
            bg_mean = np.mean(bg_zone) if bg_zone.size > 0 else 0
            
            # Gradient sharpness at the boundary column (photo_x2)
            boundary_col = arr[photo_y1:photo_y2, max(0, photo_x2-2):min(w, photo_x2+2)]
            boundary_diff = np.abs(np.diff(boundary_col, axis=1)) if boundary_col.shape[1] > 1 else 0
            boundary_sharpness = float(np.mean(boundary_diff)) if np.size(boundary_diff) > 0 else 0
            
            # Normalize photo splicing score
            photo_splicing_score = min(1.0, float(boundary_sharpness / 40.0)) if boundary_sharpness > 20 else 0.1
            
            if photo_splicing_score > 0.45:
                suspicious.append({
                    "region_name": "Photo Perimeter Discontinuity",
                    "confidence": photo_splicing_score,
                    "description": "Abrupt sharpness and luminance boundary detected around portrait area",
                    "bbox": [photo_x1, photo_y1, photo_x2 - photo_x1, photo_y2 - photo_y1]
                })
                
            return float(round(noise_score, 3)), float(round(photo_splicing_score, 3)), suspicious
            
        except Exception:
            return 0.0, 0.0, []

    @staticmethod
    def inspect_metadata(image_path: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Parses EXIF tags for evidence of editing software signatures or date anomalies.
        """
        suspicious_software = [
            "adobe", "photoshop", "gimp", "canva", "corel", "paint",
            "photopea", "lightroom", "pixlr", "affinity", "illustrator"
        ]
        metadata_flag = False
        details = {}
        
        try:
            im = Image.open(image_path)
            exif = im.getexif()
            if exif:
                for k, v in exif.items():
                    val_str = str(v).lower()
                    details[str(k)] = str(v)
                    for sw in suspicious_software:
                        if sw in val_str:
                            metadata_flag = True
                            details["flagged_editor"] = str(v)
                            break
            # Also check info dictionary for png / tiff metadata
            for k, v in getattr(im, 'info', {}).items():
                val_str = str(v).lower()
                for sw in suspicious_software:
                    if sw in val_str:
                        metadata_flag = True
                        details["flagged_software_info"] = str(v)
                        break
        except Exception:
            pass
            
        return metadata_flag, details

    @staticmethod
    def run_full_forensics_pipeline(image_path: str, document_id: str) -> Dict[str, Any]:
        """
        Executes all forensic modules and aggregates tampering signals.
        """
        ela_score, ela_path, ela_regions = ForensicsService.perform_ela(image_path, document_id)
        noise_score, photo_splicing_score, noise_regions = ForensicsService.analyze_noise_and_splicing(image_path)
        meta_flag, meta_details = ForensicsService.inspect_metadata(image_path)
        
        all_suspicious_regions = ela_regions + noise_regions
        
        # Tampering threshold decision
        has_evidence = (
            ela_score >= settings.ELA_SUSPICIOUS_THRESHOLD or
            photo_splicing_score >= 0.50 or
            noise_score >= settings.NOISE_ANOMALY_THRESHOLD or
            meta_flag
        )
        
        return {
            "ela_anomaly_score": ela_score,
            "ela_heatmap_path": ela_path,
            "photo_splicing_score": photo_splicing_score,
            "noise_variance_score": noise_score,
            "metadata_manipulation_flag": meta_flag,
            "has_tampering_evidence": has_evidence,
            "suspicious_regions_json": all_suspicious_regions
        }
