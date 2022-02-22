import React, { useState, useEffect } from 'react';
import { useApi } from './Api';
import { useNetworkMetrics } from './Network';
import BN from "bn.js";

// context type
export interface StakingMetricsContextState {
  staking: any;
}

// context definition
export const StakingMetricsContext: React.Context<StakingMetricsContextState> = React.createContext({
  staking: {},
});

// useStakingMetrics
export const useStakingMetrics = () => React.useContext(StakingMetricsContext);

// wrapper component to provide components with context
export const StakingMetricsContextWrapper = (props: any) => {

  const { isReady, api }: any = useApi();
  const { metrics }: any = useNetworkMetrics();

  const [stakingMetrics, setStakingMetrics]: any = useState({
    lastReward: 0,
    lastTotalStake: 0,
    totalNominators: 0,
    maxNominatorsCount: 0,
    maxValidatorsCount: 0,
  });

  const subscribeToStakingkMetrics = async (api: any) => {

    if (isReady() && metrics.activeEra.index !== 0) {

      const previousEra = metrics.activeEra.index - 1;

      // subscribe to staking metrics
      const unsub = await api.queryMulti([
        api.query.staking.counterForNominators,
        api.query.staking.maxNominatorsCount,
        api.query.staking.maxValidatorsCount,
        [api.query.staking.erasValidatorReward, previousEra],
        [api.query.staking.erasTotalStake, previousEra],
      ], ([_totalNominators, _maxNominatorsCount, _maxValidatorsCount, _lastReward, _lastTotalStake]: any) => {

        // format lastReward
        _lastReward = _lastReward.unwrapOrDefault(0);
        _lastReward = _lastReward === 0
          ? 0
          : new BN(_lastReward.toNumber() / (10 ** 10));

        _lastTotalStake = new BN(_lastTotalStake / (10 ** 10)).toNumber();

        console.log(_maxNominatorsCount.toString());
        console.log(_maxValidatorsCount.toString());

        setStakingMetrics({
          totalNominators: _totalNominators.toNumber(),
          lastReward: _lastReward,
          lastTotalStake: _lastTotalStake,
          maxNominatorsCount: _maxNominatorsCount.toString(),
          maxValidatorsCount: _maxValidatorsCount.toString(),
        });
      });

      return [unsub];
    }
    return null;
  }

  useEffect(() => {
    let unsub: any = subscribeToStakingkMetrics(api);

    return (() => {
      if (unsub != null) {
        for (let u = 0; u < unsub.length; u++) {
          unsub[u]();
        }
      }
    })
  }, [isReady(), metrics.activeEra]);

  return (
    <StakingMetricsContext.Provider value={{
      staking: stakingMetrics
    }}>
      {props.children}
    </StakingMetricsContext.Provider>
  );
}