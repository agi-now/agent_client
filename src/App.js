import React, { Component } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import './App.css';
import 'antd/dist/antd.css';

const EditorApp = React.lazy(() => import('./EditorApp'));
//const TaskApp = React.lazy(() => import('./TaskApp'));

const router = createBrowserRouter([
  {
    path: "/agent_client/",
    element: <EditorApp/>,
  },
//  {
//    path: "/task/",
//    element: <TaskApp/>,
//  },
]);


class App extends Component {
  render = () => {
    return (
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );
  }
}

export default App;
