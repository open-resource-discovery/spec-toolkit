import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const outputs = [
  { label: "Documentation", detail: "Readable Markdown" },
  { label: "Types", detail: "TypeScript interfaces" },
  { label: "Schemas", detail: "Ready-to-use JSON" },
];

const capabilities = [
  {
    number: "01",
    title: "Describe the contract",
    description: "Use JSON Schema as the shared, machine-readable source for your interface.",
  },
  {
    number: "02",
    title: "Add context",
    description: "Keep introductions, examples, and optional extensions close to the schema.",
  },
  {
    number: "03",
    title: "Generate consistent outputs",
    description: "Produce synchronized documentation, schemas, and types from one command.",
  },
];

export default function Home() {
  return (
    <Layout title="Spec Toolkit" description="Create JSON Schema based interface contracts and specifications.">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>JSON Schema specification toolkit</span>
            <h1 className={styles.heading}>
              Write the specification once. <span>Generate the rest.</span>
            </h1>
            <p className={styles.lead}>
              Spec Toolkit turns a JSON Schema contract into clear documentation, consumable schemas, and typed
              interfaces that stay in sync.
            </p>
            <div className={styles.heroActions}>
              <Link to="/docs/getting-started" className={styles.primaryAction}>
                Get started <span aria-hidden="true">→</span>
              </Link>
              <Link to="/docs" className={styles.secondaryAction}>
                Read the documentation
              </Link>
            </div>
            <p className={styles.status}>
              <span aria-hidden="true" /> Currently in draft, not yet recommended for production use.
            </p>
          </div>

          <div
            className={styles.toolkitVisual}
            role="img"
            aria-label="A JSON Schema source generating three synchronized outputs"
          >
            <div className={styles.sourceCard}>
              <div className={styles.cardHeader}>
                <span className={styles.fileDot} />
                <span>book.schema.yaml</span>
                <span className={styles.fileType}>SOURCE</span>
              </div>
              <pre aria-hidden="true">
                <code>
                  <span>$schema:</span> spec-v1/spec.schema.json#{"\n"}
                  <span>title:</span> Book{"\n"}
                  <span>type:</span> object{"\n"}
                  <span>properties:</span>
                  {"\n"} author: {"{ type: string }"}
                </code>
              </pre>
            </div>
            <div className={styles.connector}>
              <span className={styles.connectorLabel}>spec-toolkit</span>
            </div>
            <div className={styles.outputList}>
              {outputs.map((output) => (
                <div className={styles.outputCard} key={output.label}>
                  <span className={styles.outputMark} aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>{output.label}</strong>
                    <small>{output.detail}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.workflow} aria-labelledby="workflow-heading">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>One dependable source</span>
            <h2 id="workflow-heading">Keep every representation aligned</h2>
            <p>
              Less duplicated writing, fewer contradictions, and faster feedback for specification authors and adopters.
            </p>
          </div>
          <div className={styles.capabilityList}>
            {capabilities.map((capability) => (
              <article className={styles.capability} key={capability.number}>
                <span className={styles.capabilityNumber}>{capability.number}</span>
                <div>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.start}>
          <div>
            <span className={styles.eyebrow}>Start small</span>
            <h2>From schema to useful artifacts in one command.</h2>
          </div>
          <div className={styles.command}>
            <code>npx @open-resource-discovery/spec-toolkit -c spec-toolkit.config.json</code>
          </div>
        </section>
      </main>
    </Layout>
  );
}
