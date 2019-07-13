import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import './index.css';
import { CreateWall } from './pages/CreateWall';
import { ViewWall } from './pages/ViewWall';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
	<Router>
		<div>
			<ul>
				<li>
					<Link to="/">Home</Link>
				</li>
				<li>
					<Link to="/wall/1">About</Link>
				</li>
				<li>
					<Link to="/topics">Topics</Link>
				</li>
			</ul>

			<hr />

			<Route exact path="/" component={CreateWall} />
			<Route path="/wall/:id" component={ViewWall} />
		</div>
	</Router>,
	document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
