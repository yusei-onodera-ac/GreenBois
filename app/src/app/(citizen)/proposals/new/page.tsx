import { prisma } from "@/lib/prisma";
import NewProposalForm from "./NewProposalForm";

export default async function NewProposalPage() {
  const sites = await prisma.publicSite.findMany({ orderBy: [{ ward: "asc" }, { name: "asc" }] });
  return <NewProposalForm sites={sites} />;
}
