import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home    
      </Link>{' '}
         <Link to="/privacy" className="[&.active]:font-bold">
       | Privacy and Policy     
      </Link>
      <Link to="/Contact" className="[&.active]:font-bold">
       | Contact Us 
      </Link>
    </div>
    <hr />
    <Outlet />
    {/* <TanStackRouterDevtools /> */}
  </>
)

export const Route = createRootRoute({ component: RootLayout })