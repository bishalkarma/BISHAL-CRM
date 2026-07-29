"use client";

import * as React from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";

/**
 * A figure that counts up from zero.
 *
 * Agreed behaviour: it replays on every value change, not only on first load,
 * so switching the period filter visibly recounts the dashboard.
 *
 * The formatter is applied on every frame, so money keeps its shape the whole
 * way — "AED 4.2M", never a naked 4207431 flashing past.
 */
export function AnimatedNumber({
  value,
  format = (v) => String(Math.round(v)),
  duration = 0.6,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const [text, setText] = React.useState(() => format(value));

  /* Kept in a ref so the effect below depends only on the number itself.
     Inline arrow formatters are new on every render and would restart the
     animation forever. */
  const formatRef = React.useRef(format);
  formatRef.current = format;

  React.useEffect(() => {
    // Honour the OS "reduce motion" setting — land on the value at once.
    if (reduceMotion) {
      setText(formatRef.current(value));
      return;
    }

    const controls: AnimationPlaybackControls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setText(formatRef.current(latest)),
    });

    return () => controls.stop();
  }, [value, duration, reduceMotion, motionValue]);

  /* suppressHydrationWarning: the server renders the final value while the
     client starts from zero, which is an intended difference. */
  return <span suppressHydrationWarning>{text}</span>;
}
