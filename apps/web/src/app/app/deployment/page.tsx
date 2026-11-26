"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui";
import { DeploymentClient } from "./deployment-client";

export default function DeploymentPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading deployment workspace…" />}>
      <DeploymentClient />
    </Suspense>
  );
}
