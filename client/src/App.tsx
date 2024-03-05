import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import UploadDataPage from './pages/UploadDataPage';
import LandingPage from './pages/LandingPage';
import DataPreprocessingPage from './pages/DataPreprocessingPage';
import AnalysisSelectionPage from './pages/AnalysisSelectionPage';
import AnalysisProgressPage from './pages/AnalysisProgressPage';
import FileContextProvider from './context/fileContextProvider';

function App() {

  return (
    <div className="App">
      <FileContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<LandingPage/>}/>
            <Route path='/upload-data' element={<UploadDataPage/>}/>
            <Route path='/data-preprocessing' element={<DataPreprocessingPage/>}/>
            <Route path='/analysis-selection' element={<AnalysisSelectionPage/>}/>
            <Route path='/analysis-progress' element={<AnalysisProgressPage/>}/>
          </Routes>
        </BrowserRouter>
      </FileContextProvider>
    </div>
  );
}

export default App;
