import Link from "next/link";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/customer";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/security";
import { EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? 1));
  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
    prisma.notification.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <section className="container space-y-5 py-10">
      <header className="kg-card flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <p className="text-sm font-black uppercase text-teal">
            {unread} unread
          </p>
          <h1 className="text-3xl font-black text-navy">Notifications</h1>
        </div>
        <form action={markAllNotificationsReadAction}>
          <button className="rounded-md bg-navy px-4 py-3 font-black text-white">
            Mark all read
          </button>
        </form>
      </header>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={
              notification.readAt
                ? "kg-card p-5 opacity-75"
                : "kg-card border-l-4 border-coral p-5"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2"><StatusBadge>{notification.type}</StatusBadge>{!notification.readAt ? <span className="h-2 w-2 rounded-full bg-coral" aria-label="Unread" /> : null}</div><strong className="mt-2 block text-navy">{notification.title}</strong>
                <p className="text-sm text-slate-600">{notification.body}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {notification.createdAt.toLocaleString("en-BD")}
                </p>
                {notification.href ? (
                  <Link
                    href={notification.href}
                    className="mt-2 inline-flex text-sm font-black text-coral"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
              {!notification.readAt ? (
                <form action={markNotificationReadAction}>
                  <input
                    type="hidden"
                    name="notificationId"
                    value={notification.id}
                  />
                  <button className="rounded-md border px-3 py-2 text-sm font-bold">
                    Mark read
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!notifications.length ? <EmptyState title="No notifications" description="Order, return, review and support updates will appear here." /> : null}
      {total > 25 ? <nav aria-label="Notification pages" className="flex items-center justify-between gap-3"><Link aria-disabled={page <= 1} href={`/account/notifications?page=${Math.max(1, page - 1)}`} className={`kg-button kg-button-secondary ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}>Previous</Link><p className="text-sm font-bold text-slate-500">Page {page} of {Math.ceil(total / 25)}</p><Link aria-disabled={page >= Math.ceil(total / 25)} href={`/account/notifications?page=${Math.min(Math.ceil(total / 25), page + 1)}`} className={`kg-button kg-button-secondary ${page >= Math.ceil(total / 25) ? "pointer-events-none opacity-50" : ""}`}>Next</Link></nav> : null}
    </section>
  );
}
