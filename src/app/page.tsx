import { ButtonLink, Card, PageHeader } from "@/components/ui";

// Placeholder until the first-visit and welcome-back home is built.
export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Track a round. Get a practice plan." description="Bucket List turns the holes you play into what to practice next." />
      <Card className="flex flex-col gap-3">
        <p className="text-body">The round and practice flows are on their way. Meanwhile, see the shared components.</p>
        <ButtonLink href="/design" variant="secondary" className="w-fit">
          View the design system
        </ButtonLink>
      </Card>
    </div>
  );
}
