/**
 * @jest-environment jsdom
 */

import { fireEvent } from '@testing-library/react';
import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import ContainerBills from "../containers/Bills.js";
import mockStore from "../app/Store.js";
import firebase from "../__mocks__/store.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //expect(true).toEqual(windowIcon.className.includes("active-icon"))
      expect(windowIcon.className.includes("active-icon")).toBeTruthy();
      //to-do write expect expression (C'est fait)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "e@e"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
  describe("When I navigate to Bills", () => {
    describe("When user click on 'Nouvelle  note de frais'", () => {
      test("new route", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
        router();
        window.onNavigate(ROUTES_PATH.Bills)

        await waitFor(() => screen.getByText("Mes notes de frais"))
        let buttonNewBill = screen.getByTestId("btn-new-bill");
        fireEvent.click(buttonNewBill);
        expect(window.location.href).toContain(ROUTES_PATH.NewBill);
      })
    })
    describe("When user click on eye-icon", () => {
      test("should show modalFile", async () => {

        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
        router();
        window.onNavigate(ROUTES_PATH.Bills)

        await waitFor(() => screen.getByText("Mes notes de frais"))
        const testedElements = screen.queryAllByTestId("icon-eye");

        testedElements.forEach((Element) => {
          fireEvent.click(Element);
          setTimeout(() => {
            expect(document.getElementById("modalFile").classList.contains("show")).toBeTruthy();
          }, 500);
        })
      })
    })
  })
  describe('When I am on Bills page but it is loading', () => {
    test('Then I should land on a loading page', () => {
      const html = BillsUI({ data: [], loading: true });
      document.body.innerHTML = html;
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    });
  });
  describe('When the app try to fetch datas from the API', () => {
    describe('When it succeed', () => {
      const getSpy = jest.spyOn(firebase, 'bills');
      test('Then it should return an array with the corresponding length', async () => {

        const containerBills = new ContainerBills({
          document,
          onNavigate,
          store: firebase,
          localStorage,
        });
        const data = await containerBills.getBills();
        expect(data.length).toEqual(4);
      });
    });
    describe('When it fails with a 404 error message', () => {
      test('Then it should display a 404 error message', async () => {
        firebase.bills.mockImplementationOnce(() => {
          Promise.reject(new Error('Erreur 404'));
        });

        const html = BillsUI({ error: 'Erreur 404' });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
    });
    describe('When it fails with a 500 error message', () => {
      test('Then it should display a 500 error message', async () => {
        firebase.bills.mockImplementationOnce(() => {
          Promise.reject(new Error('Erreur 500'));
        });

        const html = BillsUI({ error: 'Erreur 500' });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
})