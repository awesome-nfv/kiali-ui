import * as React from 'react';
import { mount, shallow, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router';

import Metrics from '../Metrics';
import * as API from '../../../services/Api';
import { MetricsObjectTypes } from '../../../types/Metrics';
import { store } from '../../../store/ConfigStore';

window['SVGPathElement'] = a => a;
let mounted: ReactWrapper<any, any> | null;

const mockAPIToPromise = (func: keyof typeof API, obj: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    jest.spyOn(API, func).mockImplementation(() => {
      return new Promise(r => {
        r({ data: obj });
        setTimeout(() => {
          try {
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1);
      });
    });
  });
};

const mockServiceMetrics = (metrics: any): Promise<void> => {
  return mockAPIToPromise('getServiceMetrics', metrics);
};

const mockWorkloadMetrics = (metrics: any): Promise<void> => {
  return mockAPIToPromise('getWorkloadMetrics', metrics);
};

const mockGrafanaInfo = (info: any): Promise<any> => {
  return mockAPIToPromise('getGrafanaInfo', info);
};

const createMetric = (name: string) => {
  return {
    matrix: [
      {
        metric: { __name__: name },
        values: [[1111, 5], [2222, 10]]
      }
    ]
  };
};

const createHistogram = (name: string) => {
  return {
    average: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 10], [2222, 11]]
        }
      ]
    },
    median: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 20], [2222, 21]]
        }
      ]
    },
    percentile95: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 30], [2222, 31]]
        }
      ]
    },
    percentile99: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 40], [2222, 41]]
        }
      ]
    }
  };
};

describe('Metrics for a service', () => {
  beforeEach(() => {
    mounted = null;
  });
  afterEach(() => {
    if (mounted) {
      mounted.unmount();
    }
  });

  it('renders initial layout', () => {
    mockGrafanaInfo({});
    const wrapper = shallow(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.SERVICE}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('mounts and loads empty metrics', done => {
    const allMocksDone = [
      mockServiceMetrics({ metrics: {}, histograms: {} })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('.card-pf-body')).toHaveLength(1);
          mounted!.find('.card-pf-body').forEach(pfCard => expect(pfCard.children().length === 0));
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.SERVICE}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
  });

  it('mounts and loads full metrics', done => {
    const allMocksDone = [
      mockServiceMetrics({
        metrics: {
          request_count: createMetric('m1')
        },
        histograms: {
          request_size: createHistogram('m3'),
          request_duration: createHistogram('m5'),
          response_size: createHistogram('m7')
        }
      })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('LineChart')).toHaveLength(4);
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.SERVICE}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
  }, 10000); // Increase timeout for this test
});

describe('Inbound Metrics for a workload', () => {
  beforeEach(() => {
    mounted = null;
  });
  afterEach(() => {
    if (mounted) {
      mounted.unmount();
    }
  });

  it('renders initial layout', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <Route
          render={props => (
            <Metrics
              {...props}
              namespace="ns"
              object="svc"
              objectType={MetricsObjectTypes.WORKLOAD}
              direction={'inbound'}
              grafanaInfo={{
                url: 'http://172.30.139.113:3000',
                serviceDashboardPath: '/dashboard/db/istio-dashboard',
                workloadDashboardPath: '/dashboard/db/istio-dashboard',
                varService: 'var-service',
                varNamespace: 'var-namespace',
                varWorkload: 'var-workload'
              }}
            />
          )}
        />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('mounts and loads empty metrics', done => {
    const allMocksDone = [
      mockWorkloadMetrics({ metrics: {}, histograms: {} })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('.card-pf-body')).toHaveLength(1);
          mounted!.find('.card-pf-body').forEach(pfCard => expect(pfCard.children().length === 0));
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.WORKLOAD}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
  });

  it('mounts and loads full metrics', done => {
    const allMocksDone = [
      mockWorkloadMetrics({
        metrics: {
          request_count: createMetric('m1')
        },
        histograms: {
          request_size: createHistogram('m3'),
          request_duration: createHistogram('m5'),
          response_size: createHistogram('m7')
        }
      })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('LineChart')).toHaveLength(4);
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.WORKLOAD}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
  }, 10000); // Increase timeout for this test
});

describe('Outbound Metrics for a workload', () => {
  beforeEach(() => {
    mounted = null;
  });
  afterEach(() => {
    if (mounted) {
      mounted.unmount();
    }
  });

  it('renders initial layout', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.WORKLOAD}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('mounts and loads empty metrics', done => {
    const allMocksDone = [
      mockWorkloadMetrics({ metrics: {}, histograms: {} })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('.card-pf-body')).toHaveLength(1);
          mounted!.find('.card-pf-body').forEach(pfCard => expect(pfCard.children().length === 0));
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.WORKLOAD}
                direction={'inbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
  });

  it('mounts and loads full metrics', done => {
    const allMocksDone = [
      mockWorkloadMetrics({
        metrics: {
          request_count: createMetric('m1')
        },
        histograms: {
          request_size: createHistogram('m3'),
          request_duration: createHistogram('m5'),
          response_size: createHistogram('m7')
        }
      })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('LineChart')).toHaveLength(4);
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(
      <Provider store={store}>
        <MemoryRouter>
          <Route
            render={props => (
              <Metrics
                {...props}
                namespace="ns"
                object="svc"
                objectType={MetricsObjectTypes.WORKLOAD}
                direction={'outbound'}
                grafanaInfo={{
                  url: 'http://172.30.139.113:3000',
                  serviceDashboardPath: '/dashboard/db/istio-dashboard',
                  workloadDashboardPath: '/dashboard/db/istio-dashboard',
                  varService: 'var-service',
                  varNamespace: 'var-namespace',
                  varWorkload: 'var-workload'
                }}
              />
            )}
          />
        </MemoryRouter>
      </Provider>
    );
  }, 10000); // Increase timeout for this test
});
