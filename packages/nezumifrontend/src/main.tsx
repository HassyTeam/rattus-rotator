//import { StrictMode } from 'react'
import React, { createContext, Suspense, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import './index.css'
import App from './App.tsx'
import Queue from './Queue.tsx'
import Layout from './Layout.tsx'
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components'


function getUserId(): string {
    let userId = localStorage.getItem("userId");
    if (userId === null) {
        localStorage.setItem("userId", "");
        userId = localStorage.getItem("userId");
    };
    return userId!.toString();
}

const defaultuserId = getUserId()

export interface UserIdContextValue {
  userId: string,
  setUserId: Dispatch<SetStateAction<string>>
}

const UserIdContext = createContext<UserIdContextValue | null>(null);

function UserIdContextHandler({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>(defaultuserId);
  
  useEffect(() => {
    localStorage.setItem("userId", userId)
  }, [userId]);

  return (
    <UserIdContext value={{ userId, setUserId }}>
      {children}
    </UserIdContext>
  )
}


createRoot(document.getElementById('root')!).render(
  <FluentProvider theme={teamsLightTheme}>
    <Suspense fallback={<Loading />}>
      <UserIdContextHandler>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route index element={<App />} />
              <Route path="queue" element={<Queue />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </UserIdContextHandler>
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

export { UserIdContext };