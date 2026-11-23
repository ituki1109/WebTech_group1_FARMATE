import { redirect } from "next/navigation";

import JobForm from "@/components/farmer/JobForm";
import FarmerNav from "@/components/farmer/FarmerNav";
import { createClient } from "@/lib/supabase/server";

export default async function NewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: farm } = await supabase
    .from("farm_profiles")
    .select("verify_status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <FarmerNav />
      <h1 className="mt-6 font-heading text-2xl font-extrabold text-primary">
        求人登録
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        登録内容はデータベースに保存されます。
      </p>
      <div className="mt-6 max-w-xl">
        <JobForm farmId={user.id} canPost={farm?.verify_status === "verified"} />
      </div>
    </div>
  );
}
