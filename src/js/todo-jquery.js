'use strict';

// 经过实际测试
// import { $ } from 'jquery'
// 方式导入的外部包支持不完全
// 所以,对于第三方包统一使用 require 来导入
// 对于自己的包,使用 import 方式导入
// 非 js 资源使用 require 方式导入

require('reset');
require('../css/todo-app');

let $ = require('jquery');
let Router = require('director').Router;

class TodoApp {
  constructor($todoApp = null) {
    if (!$todoApp) {
      return;
    }

    this.NAMESPACE = 'todos';
    this.ENTER_KEY = 13;
    this.ESCAPE_KEY = 27;

    this.filter = 'all';
    this.todos = this.getStore(this.NAMESPACE);

    this._$todoApp = $todoApp;
    this._cacheElements();
    this._bindEvents();

    let routes = {
      '/:filter': (filter) => {
        this.filter = filter;
        this.render();
      }.bind(this)
    };
    let router = new Router(routes);
    router.init(this.filter);
  }
  _cacheElements() {
    this._todoTmpl = require('../../tmpl/todo.hbs');
    this._todoFooterTmpl = require('../../tmpl/todo-footer.hbs');
    this._$header = this._$todoApp.find('.header');
    this._$main = this._$todoApp.find('.main');
    this._$footer = this._$todoApp.find('.footer');
    this._$newTodo = this._$header.find('.new-todo');
    this._$toggleAll = this._$main.find('.toggle-all');
    this._$todoList = this._$main.find('.todo-list');
  }
  _bindEvents() {
    let $list = this._$todoList;

    this._$newTodo.on('keyup', this.create.bind(this));
    this._$toggleAll.on('change', this.toggleAll.bind(this));
    this._$footer.on('click', '.clear-completed', this.destroyCompleted.bind(this));

    $list.on('change', '.toggle', this.toggle.bind(this));
    $list.on('click', '.destroy', this.destroy.bind(this));
    $list.on('dblclick', 'label', this.edit.bind(this));
    $list.on('keyup', '.edit', this.editKeyup.bind(this));
    $list.on('focusout', '.edit', this.update.bind(this));
  }
  pluralize(count, word) {
    return count === 1 ? word : `${word}s`;
  }
  generateUUID() {
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16 | 0;
      let v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return uuid;
  }
  getStore(namespace = this.NAMESPACE) {
    let store = localStorage.getItem(namespace);
    return (store && JSON.parse(store)) || [];
  }
  setStore(namespace = this.NAMESPACE, data = []) {
    return localStorage.setItem(namespace, JSON.stringify(data));
  }
  indexFromEl($el) {
    let id = $el.closest('li').data('id');
    let todos = this.todos;
    let todoLength = todos.length;
    let index;

    while (todoLength--) {
      if (todos[todoLength].id === id) {
        index = todoLength;
        break;
      }
    }

    return index;
  }
  getActiveTodos() {
    return this.todos.filter((todo) => {
      return !todo.completed;
    });
  }
  getCompletedTodos () {
    return this.todos.filter((todo) => {
      return todo.completed;
    });
  }
  getFilteredTodos() {
    let filter = this.filter;
    let todos = [];

    switch (filter) {
      case 'active':
        todos = this.getActiveTodos();
        break;
      case 'completed':
        todos = this.getCompletedTodos();
        break;
      case 'all':
      default:
        todos = this.todos;
        break;
    }

    return todos;
  }
  renderFooter() {
    let todoCount = this.todos.length;
    let activeTodoCount = this.getActiveTodos().length;
    let completedTodoCount = todoCount - activeTodoCount;

    let template = this._todoFooterTmpl({
      todoCount,
      activeTodoCount,
      completedTodoCount,

      activeTodoWord: this.pluralize(activeTodoCount, 'item'),
      filter: this.filter,
    });

    this._$footer.toggle(todoCount > 0).html(template);
  }
  render() {
    let todos = this.getFilteredTodos();

    this._$todoList.html(this._todoTmpl(todos));
    this._$main.toggle(todos.length > 0);
    this._$toggleAll.prop('checked', this.getActiveTodos().length === 0);
    this.renderFooter();

    this.setStore(this.NAMESPACE, todos);
  }
  create(e) {
    let $input = $(e.target);
    let val = $input.val().trim();

    if (!val || e.which !== this.ENTER_KEY) {
      return;
    }

    this.todos.push({
      id: this.generateUUID(),
      title: val,
      completed: false,
    });

    $input.val('').focus();

    this.render();
  }
  toggleAll(e) {
    let isChecked = $(e.target).prop('checked');

    this.todos.forEach((todo) => {
      todo.completed = isChecked;
    });

    this.render();
  }
  destroyCompleted(e) {
    this.todos = this.getActiveTodos();
    this.filter = 'all';
    this.render();
  }
  toggle(e) {
    let index = this.indexFromEl($(e.target));

    this.todos[index].completed = !this.todos[index].completed;
    this.render();
  }
  destroy(e) {
    let index = this.indexFromEl($(e.target));

    this.todos.splice(index, 1);
    this.render();
  }
  edit(e) {
    let $input = $(e.target).closest('li').addClass('editing').find('.edit');
    $input.val($input.val()).focus();
  }
  editKeyup(e) {
    if (e.which === this.ENTER_KEY || e.which === this.ESCAPE_KEY) {
      $(e.target).blur();
    }
  }
  update(e) {
    let $input = $(e.target);
    let val = $input.val().trim();
    let originVal = $input.data('originVal');

    if (val === originVal) {
      return;
    }

    let index = this.indexFromEl($input);

    if (val) {
      this.todos[index].title = val;
    } else {
      this.todos.splice(index, 1);
    }

    this.render();
  }
}

$(document).ready(() => {
  let $todoApp = $('#todoApp');
  if ($todoApp.length) {
    new TodoApp($todoApp);
  }
});
