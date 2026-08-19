import Sidebar from "./Sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
