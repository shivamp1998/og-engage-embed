import './App.css';
import { Fragment } from 'react';
import Preview from './Components/Preview';
import { Route, Routes, Navigate } from 'react-router-dom';

function App() {
  return (
    <Fragment>
      <Routes>
        <Route path={`/`} element={<Navigate to={`/preview`}/>}/>
        <Route path={'/preview'} element={<Preview/>}/>
      </Routes>
    </Fragment>
  );
}

export default App;
