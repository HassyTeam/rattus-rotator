//import { StrictMode } from 'react'
import React, { createContext, Suspense, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import './index.css'
import App from './App.tsx'
import Queue from './Queue.tsx'
import Visualizer from './Visualizer.tsx'
import Layout from './Layout.tsx'
import { FluentProvider, teamsDarkTheme } from '@fluentui/react-components'


function getYourIds(): Array<string> {
    let yourIds = localStorage.getItem("yourIds");
    if (yourIds === null) {
        localStorage.setItem("yourIds", JSON.stringify([]));
        yourIds = localStorage.getItem("yourIds");
    };
    return JSON.parse(yourIds!);
}

const defaultYourIds = getYourIds()

export interface IdsContextValue {
  yourIds: string[],
  setYourIds: Dispatch<SetStateAction<string[]>>
}

const IdsContext = createContext<IdsContextValue | null>(null);

function IdsContextHandler({ children }: { children: React.ReactNode }) {
  const [yourIds, setYourIds] = useState<string[]>(defaultYourIds);
  
  useEffect(() => {
    localStorage.setItem("yourIds", JSON.stringify(yourIds))
  }, [yourIds]);

  return (
    <IdsContext value={{ yourIds, setYourIds }}>
      {children}
    </IdsContext>
  )
}


createRoot(document.getElementById('root')!).render(
    <FluentProvider theme={teamsDarkTheme}>
      <Suspense fallback={<Loading />}>
        <IdsContextHandler>
          <div id="banner-background">
            <div id="banner-background-animation">
              <div id="banner-background-inner"></div>
            </div>
          </div>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route index element={<App />} />
                <Route path="queue" element={<Queue />} />
                <Route path="visualizer" element={<Visualizer />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </IdsContextHandler>
      </Suspense>
    </FluentProvider>
)

function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
        <img src="/3dgifmaker56337.gif" />
        <span className="text-2xl font-bold">Ladataan...</span>
    </div>
  )
}

export { IdsContext };