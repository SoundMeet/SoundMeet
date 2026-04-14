// components/CropperThings.jsx
//
// Shared cropper modal for all image uploaders in Profile.
//
// Variants:
//   "profile"  — 1:1, circle preview overlay, circular PNG output
//   "banner"   — 16:5
//   "square"   — 1:1  (about me photo)
//   "portrait" — 3:4  (post image)
//   "snippet"  — 16:9 (snippet background)
//
// The working pattern (copied from the original inline croppers):
//   <img onLoad={initCropper} className="block max-h-none max-w-none" />
// No useState, no useEffect for init — just the direct onLoad callback.

import React, { useRef } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

const VARIANTS = {
  profile: {
    label:        "Crop Profile Picture",
    aspectRatio:  1,
    containerH:   340,
    containerW:   460,
    outputW:      500,
    outputH:      500,
    circle:       true,
    hint:         "Drag to reposition · Scroll to zoom",
    minW:         320,
    minH:         320,
  },
  banner: {
    label:        "Crop Banner",
    aspectRatio:  16 / 5,
    containerH:   200,
    containerW:   640,
    outputW:      1600,
    outputH:      500,
    circle:       false,
    hint:         "Drag to reposition · Scroll to zoom · 16:5 ratio",
    minW:         480,
    minH:         150,
  },
  square: {
    label:        "Crop Photo",
    aspectRatio:  1,
    containerH:   340,
    containerW:   460,
    outputW:      600,
    outputH:      600,
    circle:       false,
    hint:         "Drag to reposition · Scroll to zoom",
    minW:         320,
    minH:         320,
  },
  portrait: {
    label:        "Crop Post Image",
    aspectRatio:  3 / 4,
    containerH:   420,
    containerW:   460,
    outputW:      600,
    outputH:      800,
    circle:       false,
    hint:         "Drag to reposition · Scroll to zoom · 3:4 portrait",
    minW:         320,
    minH:         380,
  },
  snippet: {
    label:        "Crop Snippet Background",
    aspectRatio:  16 / 9,
    containerH:   180,
    containerW:   460,
    outputW:      960,
    outputH:      540,
    circle:       false,
    hint:         "Drag to reposition · Scroll to zoom · 16:9",
    minW:         320,
    minH:         160,
  },
};

// Undoes the global circle CSS from index.css for non-profile variants.
// Scoped to .crp-override so it never touches the profile crop box.
const UNDO_CIRCLE_CSS = `
  .crp-override .cropper-crop-box,
  .crp-override .cropper-view-box {
    border-radius: 0 !important;
  }
  .crp-override .cropper-crop-box {
    opacity: 1 !important;
  }
  .crp-override .cropper-point,
  .crp-override .cropper-line {
    display: none !important;
  }
`;

const CropperThings = ({ variant = "square", rawImage, onSave, onClose }) => {
  const cfg         = VARIANTS[variant];
  const imgRef      = useRef(null);
  const cropperRef  = useRef(null);
  const isProfile   = variant === "profile";

  const destroyCropper = () => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  };

  // Exactly the same pattern as the working inline croppers:
  // called directly from onLoad on the <img> tag.
  const initCropper = () => {
    if (!imgRef.current || !rawImage) return;
    destroyCropper();
    cropperRef.current = new Cropper(imgRef.current, {
      aspectRatio:              cfg.aspectRatio,
      viewMode:                 1,
      dragMode:                 "move",
      guides:                   false,
      highlight:                false,
      background:               false,
      autoCropArea:             1,
      responsive:               true,
      checkOrientation:         false,
      cropBoxMovable:           false,
      cropBoxResizable:         false,
      toggleDragModeOnDblclick: false,
      zoomOnWheel:              true,
      zoomable:                 true,
      scalable:                 false,
      movable:                  true,
      minContainerWidth:        cfg.minW,
      minContainerHeight:       cfg.minH,
    });
  };

  const handleSave = () => {
    const cropper = cropperRef.current;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width:                 cfg.outputW,
      height:                cfg.outputH,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
    if (!canvas) return;

    if (cfg.circle) {
      const size         = canvas.width;
      const circleCanvas = document.createElement("canvas");
      circleCanvas.width  = size;
      circleCanvas.height = size;
      const ctx = circleCanvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0);
      onSave(circleCanvas.toDataURL("image/png"));
    } else {
      onSave(canvas.toDataURL("image/png"));
    }

    destroyCropper();
    onClose();
  };

  const handleClose = () => {
    destroyCropper();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center">
      {!isProfile && <style>{UNDO_CIRCLE_CSS}</style>}

      {/* Backdrop */}
      <div onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-[4001] max-w-[94vw] rounded-2xl bg-neutral-900 p-6"
        style={{ width: `${cfg.containerW}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg text-white">{cfg.label}</h2>

        {/* bg-black + block max-h-none max-w-none — exact match to working inline pattern */}
        <div
          className={`relative w-full overflow-hidden rounded-xl bg-black${!isProfile ? " crp-override" : ""}`}
          style={{ height: `${cfg.containerH}px` }}
        >
          <img
            ref={imgRef}
            src={rawImage || ""}
            alt="Crop source"
            onLoad={initCropper}
            className="block max-h-none max-w-none"
          />

          {/* Profile-only circle overlay */}
          {isProfile && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full border-2 border-white overflow-visible shadow-[0px_12px_50px_rgba(0,0,0,0.5)]" />
            </div>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-neutral-500">{cfg.hint}</p>

        <div className="mt-4 flex justify-between">
          <button
            onClick={handleClose}
            className="rounded bg-neutral-700 px-4 py-2 text-white cursor-pointer hover:bg-neutral-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-pink-600 px-4 py-2 text-white cursor-pointer hover:bg-pink-500 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropperThings;