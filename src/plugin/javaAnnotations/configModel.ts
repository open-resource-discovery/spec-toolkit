export interface JavaAnnotationsConfig {
  /**
   * Java package name into which annotation interfaces will be generated.
   * e.g. "com.example.annotations"
   */
  packageAnnotations: string;

  /**
   * Java package name into which POJOs will be generated.
   * e.g. "com.example.model"
   */
  modelPackage: string;
}
