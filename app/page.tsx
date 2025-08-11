import { getAll } from "@/lib/data";
import Browse from "@/components/Browse";

export default async function Page(){
  const items = await getAll();
  return (
    <div className="space-y-6">
      <Browse items={items} />
    </div>
  );
}
