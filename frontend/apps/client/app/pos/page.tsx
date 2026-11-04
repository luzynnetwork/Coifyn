import { Suspense } from "react";
import { Register } from "../../features/tickets/components/Register";

export default function Pos() {
  return (
    <Suspense fallback={null}>
      <Register />
    </Suspense>
  );
}
