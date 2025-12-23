/**
 * @hephaitos/core - L2 핵심 서비스 (Cells)
 *
 * HEPHAITOS 트레이딩 플랫폼용 비즈니스 로직과 데이터 접근 레이어
 */

// Repositories
export {
  type IStrategyRepository,
  InMemoryStrategyRepository,
  createStrategyRepository,
} from './repositories/strategy-repository.js';

export {
  type IBacktestResultRepository,
  InMemoryBacktestResultRepository,
  createBacktestResultRepository,
} from './repositories/backtest-result-repository.js';

export {
  type IOrderRepository,
  InMemoryOrderRepository,
  createOrderRepository,
} from './repositories/order-repository.js';

export {
  type IPositionRepository,
  InMemoryPositionRepository,
  createPositionRepository,
} from './repositories/position-repository.js';

export {
  type IPortfolioRepository,
  InMemoryPortfolioRepository,
  createPortfolioRepository,
} from './repositories/portfolio-repository.js';

// Services
export {
  type IPriceDataQuery,
  type IHistoricalPriceData,
  type IPriceDataService,
  MockPriceDataService,
} from './services/price-data-service.js';

export {
  type ICredentialsService,
  CredentialsService,
  createCredentialsService,
} from './services/credentials-service.js';
