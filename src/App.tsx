import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CreateShipment } from './components/CreateShipment';
import { ShipmentList } from './components/ShipmentList';
import { ClientList } from './components/ClientList';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-shipment" element={<CreateShipment />} />
            <Route path="/shipments" element={<ShipmentList />} />
            <Route path="/clients" element={<ClientList />} />
          </Routes>
        </main>
      </div>
    </LanguageProvider>
  );
}

export default App;