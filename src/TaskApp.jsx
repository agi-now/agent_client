import React, { Component } from 'react';
import { Layout, Button } from 'antd';
import { task_api } from './task_api.js';
import Display from './components/Display.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import FooterConsole from './components/FooterConsole.jsx';
import './App.css';
import 'antd/dist/antd.css';

const { Header, Footer, Sider, Content } = Layout;


class TaskApp extends Component {
  state = {
    task_head_id: null,
  }

  onAction = (action, data) => {
    this.graph.onAction(action, data);
  }

  onNodeSelected = (node) => {
    this.cp.onNodeSelected(node);
  }

  render = () => {
    return (
      <Layout className="app">
        <Header>
          <h1>Agent v4.1</h1>
        </Header>
        <Layout>
          <Sider width={300}>
            <ControlPanel sendSelf={(x) => {this.cp = x}} onAction={this.onAction}/>
          </Sider>
          <Content>
            <Display is_task={true} task_head_id={this.state.task_head_id} sendSelf={(x) => {this.graph = x}} onNodeSelected={this.onNodeSelected}/>
          </Content>
          <Sider width={300}>
            <Button onClick={() => {task_api.continue_()}} type="primary">Continue</Button>
            <Button onClick={() => {task_api.step()}} type="default">Step</Button>
          </Sider>
        </Layout>
        <Footer>
          <FooterConsole/>
        </Footer>
      </Layout>
    );
  }
}

export default TaskApp;
