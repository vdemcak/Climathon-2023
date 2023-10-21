import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Map from "./components/Map";
import Home from "./pages/Home";

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <h1>Oops. Something went wrong :(</h1>, // TODO: Add error page
    element: (
      <>
        <div className='pointer-no-interact fixed inset-0 z-50 flex h-screen flex-col'>
          <Outlet />
        </div>
        <Map />
      </>
    ),
    children: [
      {
        path: "/",
        element: <Home />,
      },
    ],
  },
]);
const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router;
