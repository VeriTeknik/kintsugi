export default function Home() {
  return (
    <main>
      {/* kintsugi:hero-title {"type":"text","label":"Main Title","cms":"editable","constraints":{"maxLength":80},"agent":{"intent":"primary-headline","priority":"critical"}} */}
      <h1 className="text-5xl font-bold">The Center of Digital Transformation</h1>
      {/* /kintsugi:hero-title */}

      {/* kintsugi:hero-bg {"type":"image","label":"Background","cms":"editable","constraints":{"maxWidth":1920,"maxHeight":1080,"maxSizeKb":500,"allowedFormats":["jpg","png","webp"]},"agent":{"intent":"hero-visual","semanticRole":"background"}} */}
      <img src="/images/hero.webp" alt="Hero" />
      {/* /kintsugi:hero-bg */}

      {/* kintsugi:tagline {"type":"text","label":"Tagline","cms":"editable","constraints":{"maxLength":120}} */}
      <p>Fast, secure, scalable.</p>
      {/* /kintsugi:tagline */}

      {/* kintsugi:analytics {"type":"code","label":"Analytics","cms":"ai-only","agent":{"intent":"tracking-script","safeToRegenerate":true}} */}
      <script dangerouslySetInnerHTML={{ __html: '/* GA */' }} />
      {/* /kintsugi:analytics */}

      {/* kintsugi:pricing-card {"type":"group","label":"Pricing Card","cms":"editable","repeatable":true,"maxInstances":5} */}
      <div className="card">
        {/* kintsugi:plan-name {"type":"text","label":"Plan","cms":"editable","group":"pricing-card"} */}
        <h3>Pro</h3>
        {/* /kintsugi:plan-name */}
        {/* kintsugi:plan-price {"type":"text","label":"Price","cms":"editable","group":"pricing-card","constraints":{"pattern":"^[0-9]+"}} */}
        <span className="text-4xl">299</span>
        {/* /kintsugi:plan-price */}
      </div>
      {/* /kintsugi:pricing-card */}
    </main>
  );
}
