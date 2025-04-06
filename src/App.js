import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <main>
        <h1>Welcome to the React App</h1>
        <p>This is a simple React application.</p>
        <p>It is set up with a basic structure and some styling.</p>
        <p>You can start building your application from here.</p>
        <p>Feel free to modify the code and experiment with different features.</p>
        <p>Happy coding!</p>
      </main>
      <footer>
        <p>&copy; 2023 Your Name. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
