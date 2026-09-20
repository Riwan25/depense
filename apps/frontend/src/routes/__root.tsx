import { Toaster } from "@repo/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppNavbar } from "@/components/app-navbar";
import { authClient } from "@/lib/auth-client";

const queryClient = new QueryClient();

const publicPaths = ["/login", "/signup"];

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    const isPublicPage = publicPaths.includes(location.pathname);

    if (!session && !isPublicPage) {
      throw redirect({ to: "/login" });
    }

    if (session && isPublicPage) {
      throw redirect({ to: "/" });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublicPage = publicPaths.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-svh flex-col">
        {!isPublicPage && <AppNavbar />}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackRouterDevtools />
    </QueryClientProvider>
  );
}
