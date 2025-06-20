import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeableItem({
  children,
  onDelete,
}: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const swipeableRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 50;
  const MAX_SWIPE_DISTANCE = 80;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartX.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Nur horizontal swipen erlauben wenn deltaX größer als deltaY
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

    // Nur nach links swipen erlauben
    if (deltaX > 0) return;

    isDragging.current = true;
    e.preventDefault();

    const newTranslateX = Math.max(-MAX_SWIPE_DISTANCE, deltaX);
    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;

    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-MAX_SWIPE_DISTANCE);
      setIsSwiped(true);
    } else {
      resetPosition();
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
    isDragging.current = false;
  }, [translateX]);

  const handleContentClick = (e: React.MouseEvent) => {
    // Wenn das Item bereits geswiped ist, dann zurück swipen
    if (isSwiped) {
      e.preventDefault();
      e.stopPropagation();
      resetPosition();
    }
  };

  const resetPosition = () => {
    setTranslateX(0);
    setIsSwiped(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    resetPosition();
  };

  // Touch-Events manuell registrieren (non-passive)
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    contentElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    contentElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    contentElement.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      contentElement.removeEventListener("touchstart", handleTouchStart);
      contentElement.removeEventListener("touchmove", handleTouchMove);
      contentElement.removeEventListener("touchend", handleTouchEnd);
    };
  }, [translateX, handleTouchEnd]);

  // Reset wenn woanders getippt wird
  useEffect(() => {
    const handleGlobalTouch = (e: TouchEvent) => {
      if (
        isSwiped &&
        swipeableRef.current &&
        !swipeableRef.current.contains(e.target as Node)
      ) {
        resetPosition();
      }
    };

    document.addEventListener("touchstart", handleGlobalTouch);
    return () => document.removeEventListener("touchstart", handleGlobalTouch);
  }, [isSwiped]);

  return (
    <div
      ref={swipeableRef}
      className="relative overflow-hidden rounded-xl bg-white shadow-sm"
    >
      {/* Delete Button */}
      <div className="absolute right-0 top-0 h-full w-20 🔥 bg-[#c85a54] flex items-center justify-center delete-button">
        <button
          onClick={handleDelete}
          className="text-white font-medium text-sm px-3 py-2 h-full w-full flex items-center justify-center rounded-xl"
        >
          <Trash2 size={20} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative bg-white rounded-xl px-4 py-3"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging.current ? "none" : "transform 0.3s ease-out",
          touchAction: "pan-y",
        }}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
}
