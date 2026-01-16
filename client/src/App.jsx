import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ConnectionModal from './components/ConnectionModal';
import QueryPanel from './components/QueryPanel';
import ResultsTable from './components/ResultsTable';
import StructureView from './components/StructureView';
import ERDView from './components/ERDView';
import VisualizationView from './components/VisualizationView';
import './App.css';

const MainContent = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <>
      <QueryPanel />

      <div className="tabs">
        <div className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>Results</div>
        <div className={`tab ${activeTab === 'visualization' ? 'active' : ''}`} onClick={() => setActiveTab('visualization')}>Visualization</div>
        <div className={`tab ${activeTab === 'structure' ? 'active' : ''}`} onClick={() => setActiveTab('structure')}>Structure</div>
        <div className={`tab ${activeTab === 'erd' ? 'active' : ''}`} onClick={() => setActiveTab('erd')}>ER Diagram</div>
      </div>

      <div className="tab-content">
        {activeTab === 'results' && <ResultsTable />}
        {activeTab === 'visualization' && <VisualizationView />}
        {activeTab === 'structure' && <StructureView />}
        {activeTab === 'erd' && <ERDView />}
      </div>
    </>
  );
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AppProvider>
      <div className="app">
        <Sidebar onConnectClick={() => setIsModalOpen(true)} />

        <div className="main">
          <header>
            <h1>AI SQL Agent</h1>
            {/* Connection status is handled inside Sidebar or via context, but we can add a global indicator here if needed */}
          </header>

          <MainContent />
        </div>

        <ConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </AppProvider>
  );
}

export default App;
