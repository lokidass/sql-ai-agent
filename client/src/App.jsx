import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ConnectionModal from './components/ConnectionModal';
import QueryPanel from './components/QueryPanel';
import ResultsTable from './components/ResultsTable';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AppProvider>
      <div className="app">
        <Sidebar onConnectClick={() => setIsModalOpen(true)} />

        <div className="main">
          <header>
            <h1>AI SQL Agent</h1>
            <div className="connection-status">Not Connected</div>
          </header>

          <QueryPanel />

          <div className="tabs">
            <div className="tab active">Results</div>
            <div className="tab">Visualization</div>
            <div className="tab">Structure</div>
            <div className="tab">ER Diagram</div>
          </div>

          <div className="tab-content">
            <ResultsTable />
          </div>
        </div>

        <ConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </AppProvider>
  );
}

export default App;
