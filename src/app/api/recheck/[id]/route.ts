import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getReadme, listRootTree, getContributorsCount } from "@/lib/sources/github";
import { staticAuthenticityCheck } from "@/lib/signals/authenticity";
import type { Repo } from "@/lib/types";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = getDb();
  const repo = db.prepare("SELECT * FROM repos WHERE id = ?").get(Number(id)) as Repo | undefined;
  if (!repo) return NextResponse.json({ error: "repo not found" }, { status: 404 });

  try {
    const [readme, tree, contributors] = await Promise.all([
      getReadme(repo.full_name),
      listRootTree(repo.full_name),
      getContributorsCount(repo.full_name),
    ]);
    const snap = db
      .prepare("SELECT stars FROM repo_snapshots WHERE repo_id = ? ORDER BY ts DESC LIMIT 1")
      .get(repo.id) as { stars: number } | undefined;

    const result = staticAuthenticityCheck({
      full_name: repo.full_name,
      description: repo.description,
      readme,
      tree,
      stars: snap?.stars ?? 0,
      contributors,
      gained7d: 0,
    });

    db.prepare(
      `INSERT OR REPLACE INTO repo_authenticity (repo_id,label,evidence,flags,checked_at)
       VALUES (?,?,?,?,?)`
    ).run(
      repo.id,
      result.label,
      JSON.stringify(result.evidence),
      JSON.stringify(result.flags),
      new Date().toISOString()
    );

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
