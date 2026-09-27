export async function register() {
  // Kept in this exact form so Next.js leaves the database code out of the edge bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCrmWorker } = await import("./lib/crymad-crm/worker");
    startCrmWorker();
  }
}
