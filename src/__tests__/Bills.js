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
import firebase from "../__mocks__/store.js"

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }));
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
  });
  describe("When I am on Bills Page and I click on 'Nouvelle  note de frais'", () => {
    test("new route", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByText("Mes notes de frais"))
      let buttonNewBill = screen.getByTestId("btn-new-bill");
      fireEvent.click(buttonNewBill);
      expect(window.location.href).toContain(ROUTES_PATH.NewBill);
    })
  });
  describe("When I am on Bills Page and I click on eye-icon", () => {
    test("should show modalFile", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
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
  });

  describe('When I am on Bills page but it is loading', () => {
    test('Then I should land on a loading page', () => {
      const html = BillsUI({ data: [], loading: true });
      document.body.innerHTML = html;
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    });
  });
  describe('When the app try to fetch datas from the API', () => {
    describe('When it succeed', () => {
      jest.spyOn(firebase, 'bills');
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
      test('Then it should throw a 404 error message', async () => {

        jest.spyOn(firebase, 'bills').mockImplementationOnce(() => {
          throw new Error("Erreur 404");
        });

        const containerBills = new ContainerBills({
          document,
          onNavigate,
          store: firebase,
          localStorage,
        });
        try { await containerBills.getBills(); }
        catch (error) { expect(error.message).toEqual("Erreur 404"); }
      });
    });
    describe('When it fails with a 500 error message', () => {
      jest.spyOn(firebase, 'bills');
      test('Then it should throw a 500 error message', async () => {
        jest.spyOn(firebase, 'bills').mockImplementationOnce(() => {
          throw new Error("Erreur 500");
        });

        const containerBills = new ContainerBills({
          document,
          onNavigate,
          store: firebase,
          localStorage,
        });
        try { await containerBills.getBills(); }
        catch (error) { expect(error.message).toEqual("Erreur 500"); }
      });
    });
  });
});