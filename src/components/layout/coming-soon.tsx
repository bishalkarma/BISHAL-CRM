import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  icon: Icon,
  part,
  features,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  part: string;
  features: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Card className="overflow-hidden">
        <div className="relative border-b border-border bg-gradient-to-br from-accent/[0.09] to-transparent p-8 text-center sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <Icon className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <Badge variant="accent" className="mt-4">
            Shipping in {part}
          </Badge>
        </div>

        <div className="p-6 sm:p-8">
          <div className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            What&apos;s coming
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 rounded-lg bg-secondary/50 p-3 text-sm"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="mt-6 w-full sm:w-auto" asChild>
            <Link href="/dashboard">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
