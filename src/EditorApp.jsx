import React, { Component } from 'react';
import { Layout } from 'antd';
import { api } from './api.js';
import Display from './components/Display.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import FooterConsole from './components/FooterConsole.jsx';
import './App.css';
import 'antd/dist/antd.css';

const { Header, Footer, Sider, Content } = Layout;


class EditorApp extends Component {
  onAction = (action, data) => {
    console.log(api);
    this.graph.onAction(action, data);
  }

  onNodeSelected = (node) => {
    this.cp.onNodeSelected(node);
  }

  render = () => {
    return (
      <Layout className="app">
        <Header>
          <div id="requests_count" className="requests-pending-count"></div>
          <h1>Agent v5.0</h1>
        </Header>
        <Layout>
          <Sider width={300}>
            <ControlPanel sendSelf={(x) => {this.cp = x}} onAction={this.onAction}/>
          </Sider>
          <Content>
            <Display key={1} editor={true} sendSelf={(x) => {this.graph = x}} onNodeSelected={this.onNodeSelected}/>
          </Content>
        </Layout>
        <Footer>
          <FooterConsole/>
        </Footer>
      </Layout>
    );
  }
}

export default EditorApp;
