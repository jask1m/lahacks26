"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { TestRunWithDetails } from "@/lib/supabase/types";
import { Topbar } from "@/components/dashboard/topbar";
import { RunHistoryTable } from "@/components/dashboard/run-history-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const PAGE_SIZE = 25;

export default function RunHistoryPage() {
  const [runs, setRuns] = useState<TestRunWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadRuns = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const { data, error } = await supabase
      .from("test_runs")
      .select(
        `
        *,
        tests!inner(
          id,
          name,
          steps,
          project_id,
          projects!inner(id, name)
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error loading runs:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const typedData = data as unknown as TestRunWithDetails[];

    if (append) {
      setRuns((prev) => [...prev, ...typedData]);
    } else {
      setRuns(typedData);
    }

    setHasMore(typedData.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    const channel = supabase
      .channel("run-history-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "test_runs" },
        (payload) => {
          setRuns((prev) =>
            prev.map((run) =>
              run.id === payload.new.id
                ? {
                    ...run,
                    status: payload.new.status as TestRunWithDetails["status"],
                    started_at: payload.new.started_at,
                    completed_at: payload.new.completed_at,
                  }
                : run
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "test_runs" },
        () => {
          loadRuns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRuns]);

  const handleLoadMore = () => {
    loadRuns(runs.length, true);
  };

  return (
    <>
      <Topbar
        breadcrumbs={[{ label: "Run History" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRuns()}
            disabled={loading}
            className="bg-transparent border-border-highlight text-muted-foreground hover:bg-bg-2 hover:text-foreground text-[13px] h-8"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      <div className="p-7 flex-1">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary mb-2.5">
          Recent Runs
        </div>

        <div className="bg-bg-1 border border-border rounded-lg overflow-hidden">
          <RunHistoryTable runs={runs} loading={loading} />
        </div>

        {hasMore && runs.length > 0 && !loading && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-transparent border-border-highlight text-muted-foreground hover:bg-bg-2 hover:text-foreground text-[13px]"
            >
              {loadingMore ? "Loading..." : "Show more"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
