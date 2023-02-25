import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import React, { Component } from 'react';

let last_node_id = null;

export default function NodeEditor(props)  {
  const [form] = Form.useForm();

  let data = {};

  if (props.node !== null) {
    data = Object.entries(props.node.data().data).map(k => {
      return {
        'key': k[0],
        'value': k[1],
      }
    });
  }

  if (props.node === null || last_node_id !== props.node.id()) {
    setTimeout(() => {
      form.setFieldsValue({
        fields: data,
      });
    }, 50);
  }

  if (props.node !== null) {
    last_node_id = props.node.id();
  } else {
    last_node_id = null;
  }

  return props.node === null ? null : (
    <>
    <Form form={form}
          name="dynamic_form_nest_item"
          onFinish={(data) => {
            props.saveFields(props.node, data.fields.reduce(function(map, obj) {
                map[obj.key] = obj.value;
                return map;
            }, {}));
          }}
          autoComplete="off">
      <Form.List name="fields">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 0, }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'key']}
                  rules={[{ required: true, message: 'Missing key' }]}
                >
                  <Input placeholder="Key" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'value']}
                  rules={[{ required: true, message: 'Missing value' }]}
                >
                  <Input placeholder="Value" />
                </Form.Item>
                <CloseCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
             {(props.node.isEdge() && props.node.data().label === "next") ? (
                <div className="edge-name-btns">
                  <Button type="dashed" onClick={() => add({"key": "name", "value": "ok"})}>Ok</Button>
                  <Button type="dashed" onClick={() => add({"key": "name", "value": "error"})}>Error</Button>
                  <Button type="dashed" onClick={() => add({"key": "name", "value": "yes"})}>Yes</Button>
                  <Button type="dashed" onClick={() => add({"key": "name", "value": "no"})}>No</Button>
                </div>
              ) : null}
              <Button type="dashed" onClick={() => {add(); form.submit()}} icon={<PlusOutlined />}></Button>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form>
    </>
  );
};
