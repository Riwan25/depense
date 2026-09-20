import { Button, Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger, cn } from "@repo/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChartPie, LogOut, Menu, Tags, Wallet } from "lucide-react";
import { useState } from "react";

import { signOut, useSession } from "@/lib/auth-client";

const navItems = [
  { to: "/", label: "Home", icon: Wallet, exact: true },
  { to: "/dashboard", label: "Stats", icon: ChartPie, exact: false },
  { to: "/categories", label: "Categories", icon: Tags, exact: false },
] as const;

const linkBaseClass =
  "text-muted-foreground hover:text-foreground hover:bg-accent/60 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActiveClass = "bg-accent text-foreground";

export function AppNavbar() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
            <Wallet className="size-4" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">Dépense</span>
        </Link>

        {/* Desktop navigation */}
        <div className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className={linkBaseClass}
              activeProps={{ className: linkActiveClass }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {session?.user && (
            <span className="text-muted-foreground hidden max-w-[16rem] truncate text-sm lg:inline">
              {session.user.email}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>

          {/* Mobile navigation */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" />}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-4">
              <SheetTitle className="flex items-center gap-2">
                <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Wallet className="size-4" />
                </span>
                Dépense
              </SheetTitle>
              {session?.user && (
                <p className="text-muted-foreground -mt-2 truncate text-sm">{session.user.email}</p>
              )}

              <div className="flex flex-col gap-1">
                {navItems.map(({ to, label, icon: Icon, exact }) => (
                  <SheetClose
                    key={to}
                    render={
                      <Link
                        to={to}
                        activeOptions={{ exact }}
                        className={cn(linkBaseClass, "py-3 text-base")}
                        activeProps={{ className: linkActiveClass }}
                      />
                    }
                  >
                    <Icon className="size-5" />
                    {label}
                  </SheetClose>
                ))}
              </div>

              <Button variant="outline" className="mt-auto w-full" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
