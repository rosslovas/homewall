import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import './index.css';
import { CreateProblem } from './pages/CreateProblem';
import { CreateWall } from './pages/CreateWall';
import { ProblemList } from './pages/ProblemList';
import { ViewProblem } from './pages/ViewProblem';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
	<Router>
		<div>
			<ul>
				<li>
					<Link to="/">Create Wall (WIP)</Link>
				</li>
				<li>
					<Link to="/wall/3">Create Problem</Link>
				</li>
				<li>
					<Link to="/wall/3/problems">Problem List</Link>
				</li>
			</ul>

			<hr />

			<Route exact path="/" component={CreateWall} />
			<Route exact path="/wall/:wallId" component={CreateProblem} />
			<Route exact path="/wall/:wallId/problems" component={ProblemList} />
			<Route exact path="/wall/:wallId/problem/:problemId" component={ViewProblem} />
		</div>
	</Router>,
	document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
