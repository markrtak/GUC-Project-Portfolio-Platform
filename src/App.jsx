/**
 * App.jsx — Root shell: Suspense boundary + lazy route tree.
 * Route definitions live in routes/AppRoutes.jsx.
 */

import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import AppRoutes from '@/routes/AppRoutes';

export default function App() {
  return (
    <Suspense fallback={<Loader message="Loading page…" />}>
      <AppRoutes />
    </Suspense>
  );
}
