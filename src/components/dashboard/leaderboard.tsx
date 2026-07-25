"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { TEAM_LEADERBOARD } from "@/lib/demo-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn, formatCompactCurrency, initials } from "@/lib/utils";

export function Leaderboard() {
  return (
    <ul className="space-y-4">
      {TEAM_LEADERBOARD.map((member, index) => (
        <motion.li
          key={member.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.34,
            delay: index * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <Avatar className="size-9">
              <AvatarFallback
                className={cn(
                  index === 0
                    ? "bg-accent/15 text-accent"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            {index === 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-warning text-warning-foreground">
                <Trophy className="size-2.5" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {member.name}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatCompactCurrency(member.revenue)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={member.quota} className="h-1.5 flex-1" />
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {member.quota}%
              </span>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
