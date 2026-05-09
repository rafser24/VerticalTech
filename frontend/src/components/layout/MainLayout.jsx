import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children, title }) {
  return (
    <div className="flex h-screen overflow-hidden bg-pastel-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
