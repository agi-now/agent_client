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
    path: "/",
    element: <EditorApp/>,
  },
//  {
//    path: "/task/",
//    element: <TaskApp/>,
//  },
]);


class App extends Component {
  componentDidMount() {
    setTimeout(() => {
      document.getElementById('loading-banner').style.opacity = 0;
      document.getElementById('loading-banner').style.zIndex = 0;
    }, 600);
    setTimeout(() => {
      document.getElementById('loading-banner').style.display = 'none';
    }, 1400);
  }
  render = () => {
    return (
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );
  }
}

export default App;
