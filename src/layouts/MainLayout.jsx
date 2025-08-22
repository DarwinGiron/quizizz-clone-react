import React from 'react';
import { Layout } from '../shared';

const MainLayout = ({ children }) => {
  return (
    <Layout>
      <main className="p-4 lg:p-6">
        {children}
      </main>
    </Layout>
  );
};

export default MainLayout;