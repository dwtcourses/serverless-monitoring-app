import { render } from '@testing-library/react';
import React from 'react';
import renderer from 'react-test-renderer';
import Refresh from './Refresh';

jest.mock('@aws-amplify/auth', () => {
  return { currentSession: jest.fn() };
});

import Auth from '@aws-amplify/auth';

const fetch = jest.fn();
// @ts-ignore
global.fetch = fetch;

const api = 'api';
process.env.REACT_APP_REST_API = api;

describe('Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { getByText } = render(<Refresh />);
    expect(getByText('Refresh')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const tree = renderer.create(<Refresh />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('calls api on button click', async () => {
    const idToken = 'idToken';
    const getJwtToken = jest.fn(() => idToken);
    const getIdToken = jest.fn(() => ({ getJwtToken }));
    const credentials = { getIdToken };
    (Auth.currentSession as jest.Mock<any>).mockReturnValue(
      Promise.resolve(credentials),
    );

    const promise = Promise.resolve();
    fetch.mockReturnValue(promise);

    const { getByTestId } = render(<Refresh />);
    const button = getByTestId('refresh');
    button.click();

    await promise;

    expect(Auth.currentSession).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(getJwtToken).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${api}/fanout`, {
      headers: { Authorization: idToken },
      method: 'POST',
    });
  });
});
