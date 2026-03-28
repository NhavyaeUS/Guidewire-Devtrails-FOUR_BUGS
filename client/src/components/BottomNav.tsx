import { NavLink } from 'react-router-dom';
import { Home, Shield, History, User } from 'lucide-react';
import clsx from 'clsx';

export default function BottomNav() {
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Policy', path: '/policy', icon: Shield },
    { name: 'Claims', path: '/claims', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t safe-area-pb">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center w-16 h-12 transition-all duration-300',
                  isActive ? 'text-amber-500 scale-110' : 'text-teal-400/60 hover:text-teal-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <div className="absolute -inset-1 bg-amber-500/20 blur-sm rounded-full -z-10" />
                    )}
                  </div>
                  <span
                    className={clsx(
                      'text-[10px] mt-1 font-medium transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-70'
                    )}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
