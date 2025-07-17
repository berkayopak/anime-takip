/**
 * Base Use Case Class
 * All use cases should extend this base class for consistency
 */
class BaseUseCase {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  /**
   * Execute the use case
   * This method should be overridden by concrete use cases
   * @param {*} input - Input parameters for the use case
   * @returns {Promise} - Result of the use case execution
   */
  async execute(input) {
    throw new Error('execute method must be implemented by concrete use cases');
  }

  /**
   * Validate input parameters
   * @param {*} input - Input to validate
   * @throws {Error} - If validation fails
   */
  validateInput(input) {
    // Base validation - can be overridden
    if (input === null || input === undefined) {
      throw new Error('Input cannot be null or undefined');
    }
  }

  /**
   * Handle errors consistently across use cases
   * @param {Error} error - Error to handle
   * @param {string} operation - Name of the operation that failed
   */
  handleError(error, operation) {
    console.error(`${this.constructor.name} - ${operation} failed:`, error);
    throw error;
  }
}

module.exports = BaseUseCase;
