#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os

try:
    import PyPDF2
    
    def read_pdf(file_path):
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text()
                    text += "\n\n--- صفحه {} ---\n\n".format(page_num + 1)
                
                return text
        except Exception as e:
            return f"خطا در خواندن PDF: {str(e)}"
    
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        if os.path.exists(pdf_path):
            content = read_pdf(pdf_path)
            print(content)
        else:
            print("فایل یافت نشد!")
    else:
        print("لطفاً مسیر فایل PDF را وارد کنید")

except ImportError:
    print("PyPDF2 نصب نیست. در حال نصب...")
    os.system("pip install PyPDF2")
    
    try:
        import PyPDF2
        print("PyPDF2 با موفقیت نصب شد. لطفاً دوباره اجرا کنید.")
    except:
        print("خطا در نصب PyPDF2")
